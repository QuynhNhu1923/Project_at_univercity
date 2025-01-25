package source.DataStructure;

import java.util.*;

public class Queue extends DataStructure {

    @Override //Enqueue
    public void insert(int value) {
        elements.add(value); 
    }

    @Override //Dequeue
    public void delete(int value) {
        if (!elements.isEmpty()) {
            elements.remove(0); 
        }
    }

    @Override
    public boolean find(int value) {
        return elements.contains(value);
    }

    @Override
    public void sort() {
        Collections.sort(elements); 
    }

    @Override
    public String getType(){
        return "Queue";
    }
}
